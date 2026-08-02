import "server-only";

export function hasGaMeasurementId(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GA_ID?.trim());
}

export function hasGaDataApiConfig(): boolean {
  return Boolean(
    process.env.GA_PROPERTY_ID?.trim() &&
      process.env.GA_SERVICE_ACCOUNT_EMAIL?.trim() &&
      process.env.GA_SERVICE_ACCOUNT_PRIVATE_KEY?.trim(),
  );
}

export function getGaPropertyId(): string {
  const id = process.env.GA_PROPERTY_ID?.trim();
  if (!id) throw new Error("Missing GA_PROPERTY_ID");
  return id;
}

export function getGaServiceAccountCredentials(): {
  client_email: string;
  private_key: string;
} {
  const client_email = process.env.GA_SERVICE_ACCOUNT_EMAIL?.trim();
  let private_key = process.env.GA_SERVICE_ACCOUNT_PRIVATE_KEY?.trim();
  if (!client_email || !private_key) {
    throw new Error(
      "Missing GA_SERVICE_ACCOUNT_EMAIL or GA_SERVICE_ACCOUNT_PRIVATE_KEY",
    );
  }
  // Vercel / .env often stores newlines as \n
  private_key = private_key.replace(/\\n/g, "\n");
  return { client_email, private_key };
}
