"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
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
  customerId: z.string({
    invalid_type_error: "Please select a customer.",
  }),
  amount: z.coerce.number().gt(0, {
    message: "Please enter an amount greater than $0.",
  }),
  status: z.enum(["pending", "paid"], {
    invalid_type_error: "Please select an invoice status.",
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({
  id: true,
  date: true,
});

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  // Validate the form data using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  console.log("Validated Fields:", validatedFields);

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Invoice.",
    };
  }

  const { customerId, amount, status } = validatedFields.data;

  // Usually good practice to store money amounts in cents to avoid floating point issues
  const amountInCents = Math.round(amount * 100);

  // Get current date in YYYY-MM-DD format
  const date = new Date().toISOString().split("T")[0];

  try {
    // Proceed with creating the invoice
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
  } catch (error) {
    // Handle validation errors
    console.error("Error creating invoice:", error);
    throw new Error("Invalid form data");
  }

  // Revalidate the path to ensure the new invoice is reflected in the UI
  // Next.js cached the page, so we need to tell it to re-fetch the data
  revalidatePath("/dashboard/invoices");

  // Redirect to the invoices page after successful creation
  redirect("/dashboard/invoices");
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData
) {
  // Validate the form data using Zod
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    // If form validation fails, return errors early. Otherwise, continue.
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Update Invoice.",
    };
  }
  const { customerId, amount, status } = validatedFields.data;

  // Usually good practice to store money amounts in cents to avoid floating point issues
  const amountInCents = Math.round(amount * 100);

  try {
    // Proceed with updating the invoice
    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;
  } catch (error) {
    // Handle validation errors
    console.error("Error updating invoice:", error);
    throw new Error("Invalid form data");
  }

  // Revalidate the path to ensure the updated invoice is reflected in the UI
  revalidatePath(`/dashboard/invoices/${id}`);

  // Redirect to the invoices page after successful update
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  try {
    // Proceed with deleting the invoice
    await sql`
    DELETE FROM invoices
    WHERE id = ${id}
  `;
  } catch (error) {
    // Handle errors during deletion
    console.error("Error deleting invoice:", error);
    throw new Error("Failed to delete invoice");
  }
  // Revalidate the path to ensure the deleted invoice is no longer shown
  revalidatePath("/dashboard/invoices");
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}
