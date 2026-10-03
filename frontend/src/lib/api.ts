export const apiUrl = (
  import.meta.env.VITE_API_URL || "http://localhost:4000"
).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = localStorage.getItem("certichain_token");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(
      "The CERTICHAIN API is unavailable. Check that the backend is running.",
      0,
    );
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      body.error || `Request failed (${response.status})`,
      response.status,
    );
  }
  return body as T;
}

export async function downloadCertificate(certificateId: string) {
  const headers = new Headers();
  const token = localStorage.getItem("certichain_token");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(
      `${apiUrl}/api/certificates/${encodeURIComponent(certificateId)}/download`,
      { headers },
    );
  } catch {
    throw new ApiError(
      "The CERTICHAIN API is unavailable. Check that the backend is running.",
      0,
    );
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      body.error || `Download failed (${response.status})`,
      response.status,
    );
  }

  const fileUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = fileUrl;
  link.download = `${certificateId}.pdf`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(fileUrl);
}
