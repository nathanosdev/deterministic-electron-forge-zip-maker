import path from 'path';

import { MakerBase, MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';

import { DeterministicZipMakerConfig } from './config';
import { createZip } from './create-zip';

export default class DeterministicZipMaker extends MakerBase<DeterministicZipMakerConfig> {
  public readonly name = 'deterministic-zip';
  public readonly defaultPlatforms: ForgePlatform[] = [
    'darwin',
    'mas',
    'win32',
    'linux',
  ];

  public isSupportedOnCurrentPlatform(): boolean {
    return true;
  }

  public async make({
    dir,
    makeDir,
    appName,
    packageJSON,
    targetArch,
    targetPlatform,
  }: MakerOptions): Promise<string[]> {
    const sourceDirectory = ['darwin', 'mas'].includes(targetPlatform)
      ? path.resolve(dir, `${appName}.app`)
      : dir;

    const zipName = `${path.basename(dir)}-${packageJSON.version}.zip`;
    const destinationPath = path.resolve(
      makeDir,
      'zip',
      targetPlatform,
      targetArch,
      zipName,
    );

    await this.ensureFile(destinationPath);

    return await createZip(sourceDirectory, destinationPath);
  }
}

export { DeterministicZipMaker, DeterministicZipMakerConfig };
