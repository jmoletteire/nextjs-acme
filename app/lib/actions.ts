"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import postgres from "postgres";

// Initialize the PostgreSQL client
const sql = postgres(process.env.POSTGRES_URL!, {
  // Optional: Configure the client to use SSL if your database requires it
  // This is useful for production environments where the database is hosted remotely
  // and requires secure connections.
  // If you're running a local database, you might not need this.
  ssl: "require",
});

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({
  id: true,
  date: true,
});

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  // Validate the form data using Zod
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  // Usually good practice to store money amounts in cents to avoid floating point issues
  const amountInCents = Math.round(amount * 100);

  // Get current date in YYYY-MM-DD format
  const date = new Date().toISOString().split("T")[0];

  // Proceed with creating the invoice
  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;

  // Revalidate the path to ensure the new invoice is reflected in the UI
  // Next.js cached the page, so we need to tell it to re-fetch the data
  revalidatePath("/dashboard/invoices");

  // Redirect to the invoices page after successful creation
  redirect("/dashboard/invoices");
}

export async function updateInvoice(id: string, formData: FormData) {
  // Validate the form data using Zod
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  // Usually good practice to store money amounts in cents to avoid floating point issues
  const amountInCents = Math.round(amount * 100);

  // Proceed with updating the invoice
  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;

  // Revalidate the path to ensure the updated invoice is reflected in the UI
  revalidatePath(`/dashboard/invoices/${id}`);

  // Redirect to the invoices page after successful update
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  // Proceed with deleting the invoice
  await sql`
    DELETE FROM invoices
    WHERE id = ${id}
  `;

  // Revalidate the path to ensure the deleted invoice is no longer shown
  revalidatePath("/dashboard/invoices");
}
