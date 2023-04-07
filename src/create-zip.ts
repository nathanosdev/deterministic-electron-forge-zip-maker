import JSZip from 'jszip';
import { join } from 'node:path';
import { opendir, stat } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';

async function addDirToZip(
  zip: JSZip,
  sourceDirectory: string,
  rootDirectory: string,
): Promise<void> {
  const dir = await opendir(sourceDirectory);

  for await (const dirent of dir) {
    const fullpath = join(sourceDirectory, dirent.name);

    if (dirent.isFile()) {
      const fileReadStream = createReadStream(fullpath);
      const fileStats = await stat(fullpath);
      const archivePath = fullpath.replace(rootDirectory, '');

      zip.file(archivePath, fileReadStream, {
        date: new Date(fileStats.mtimeMs),
      });
    } else if (dirent.isDirectory()) {
      await addDirToZip(zip, fullpath, rootDirectory);
    } else {
      throw new Error(`Unsupported file type: ${dirent.name}`);
    }
  }
}

export async function createZip(
  sourceDirectory: string,
  destinationPath: string,
): Promise<void> {
  const zip = new JSZip();

  await addDirToZip(zip, sourceDirectory, sourceDirectory);

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
