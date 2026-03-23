import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

import {
  employeeService,
  EmployeeNotFoundError,
} from "@/lib/employees/employee.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function getFileExtension(fileName: string) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() ?? "jpg" : "jpg";
}

function isSupportedImageType(mimeType: string) {
  return ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
    mimeType,
  );
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Debemos enviar un archivo de imagen." },
        { status: 400 },
      );
    }

    if (!file.name) {
      return NextResponse.json(
        { error: "El archivo no tiene un nombre válido." },
        { status: 400 },
      );
    }

    if (!isSupportedImageType(file.type)) {
      return NextResponse.json(
        {
          error:
            "Formato no soportado. Solo admitimos JPG, PNG, WEBP o GIF.",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: "La imagen supera el tamaño máximo permitido de 5 MB.",
        },
        { status: 400 },
      );
    }

    const extension = getFileExtension(file.name);
    const safeName = `empleados/${id}/${Date.now()}.${extension}`;

    const blob = await put(safeName, file, {
      access: "public",
      addRandomSuffix: false,
    });

    const employee = await employeeService.update(id, {
      photoUrl: blob.url,
    });

    return NextResponse.json({
      success: true,
      photoUrl: employee.photoUrl,
    });
  } catch (error) {
    if (error instanceof EmployeeNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    const message =
      error instanceof Error ? error.message : "No se pudo subir la foto.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}