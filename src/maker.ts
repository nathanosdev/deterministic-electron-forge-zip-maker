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
    packageJSON,
    targetArch,
    targetPlatform,
  }: MakerOptions): Promise<string[]> {
    const zipName = `${path.basename(dir)}-${packageJSON.version}.zip`;
    const destinationPath = path.resolve(
      makeDir,
      'zip',
      targetPlatform,
      targetArch,
      zipName,
    );

    await this.ensureFile(destinationPath);

    return await createZip(dir, destinationPath);
  }
}

export { DeterministicZipMaker, DeterministicZipMakerConfig };
