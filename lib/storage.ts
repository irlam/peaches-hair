import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

function storageRoot() {
  return path.join(process.cwd(), "data", "uploads");
}

function storedPath(objectKey: string) {
  const root = storageRoot();
  const target = path.resolve(root, objectKey);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    throw new Error("Invalid storage key");
  }
  return target;
}

export async function putStoredObject(objectKey: string, bytes: Uint8Array) {
  const target = storedPath(objectKey);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
}

export async function readStoredObject(objectKey: string) {
  try {
    return await readFile(storedPath(objectKey));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function deleteStoredObject(objectKey: string) {
  try {
    await unlink(storedPath(objectKey));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
