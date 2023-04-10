import JSZip from 'jszip';
import { join } from 'node:path';
import { readdir, lstat, readlink } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { isWindows } from './platform';

function getArchivePath(path: string, rootDirectory: string): string {
  const archivePath = path.replace(rootDirectory, '').replaceAll('\\', '/');

  return archivePath.charAt(0) === '/' ? archivePath.substring(1) : archivePath;
}

async function addDirChildrenToZip(
  zip: JSZip,
  sourceDirectory: string,
  rootDirectory: string,
): Promise<void> {
  const dirChildren = await readdir(sourceDirectory);

  for (const filename of dirChildren) {
    const fullpath = join(sourceDirectory, filename);
    const archivePath = getArchivePath(fullpath, rootDirectory);
    const fileStats = await lstat(fullpath);
    const date = new Date(0);
    
    if (fileStats.isSymbolicLink()) {
      zip.file(archivePath, readlink(fullpath), {
        date,
        dir: fileStats.isDirectory(),
        unixPermissions: !isWindows ? parseInt('120755', 8) : undefined,
      });
    } else {
      if (fileStats.isDirectory()) {
        zip.file(archivePath, null, {
          date,
          dir: true,
          unixPermissions: !isWindows ? fileStats.mode : undefined,
        });

        await addDirChildrenToZip(zip, fullpath, rootDirectory);
      } else {
        zip.file(archivePath, createReadStream(fullpath), {
          date,
          unixPermissions: !isWindows ? fileStats.mode : undefined,
        });
      }
    }
  }
}

function writeZipToFile(zip: JSZip, destinationPath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    zip
      .generateNodeStream({
        compression: 'DEFLATE',
        compressionOptions: {
          level: 9,
        },
        streamFiles: true,
        platform: isWindows ? 'DOS' : 'UNIX',
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

  await addDirChildrenToZip(zip, sourceDirectory, sourceDirectory);

  await writeZipToFile(zip, destinationPath);

  return [destinationPath];
}
