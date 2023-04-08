import JSZip from 'jszip';
import { join } from 'node:path';
import { opendir } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';

function getArchivePath(path: string, rootDirectory: string): string {
  const archivePath = path.replace(rootDirectory, '').replaceAll('\\', '/');

  return archivePath.charAt(0) === '/' ? archivePath.substring(1) : archivePath;
}

async function addDirToZip(
  zip: JSZip,
  sourceDirectory: string,
  rootDirectory: string,
): Promise<void> {
  const dir = await opendir(sourceDirectory);

  for await (const dirent of dir) {
    const fullpath = join(sourceDirectory, dirent.name);
    const archivePath = getArchivePath(fullpath, rootDirectory);

    if (dirent.isFile()) {
      const fileReadStream = createReadStream(fullpath);

      zip.file(archivePath, fileReadStream, {
        date: new Date(0),
      });
    } else if (dirent.isDirectory()) {

      zip.file(archivePath, null, {
        dir: true,
        date: new Date(0),
      });

      await addDirToZip(zip, fullpath, rootDirectory);
    } else {
      throw new Error(`Unsupported file type: ${dirent.name}`);
    }
  }
}

function writeZipToFile(zip: JSZip, destinationPath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    zip
      .generateNodeStream({
        compression: 'STORE',
        streamFiles: true,
      })
      .pipe(
        createWriteStream(destinationPath, {
          flags: 'wx',
        }),
      )
      .on('finish', () => {
        resolve();
      })
      .on('error', error => {
        reject(error);
      });
  });
}

export async function createZip(
  sourceDirectory: string,
  destinationPath: string,
): Promise<string[]> {
  const zip = new JSZip();

  await addDirToZip(zip, sourceDirectory, sourceDirectory);

  await writeZipToFile(zip, destinationPath);

  return [destinationPath];
}
