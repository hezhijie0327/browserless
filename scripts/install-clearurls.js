#!/usr/bin/env node
/* global fetch, console, process */
'use strict';

import { createWriteStream, existsSync, mkdirSync } from 'fs';
import path, { join } from 'path';
import { Readable } from 'stream';
import { deleteAsync } from 'del';
import { moveFile } from 'move-file';
import os from 'os';
import unzip from 'extract-zip';

(async () => {
  const tmpDir = path.join(os.tmpdir(), '_ublite' + Date.now());

  // Create temporary directory if it doesn't exist
  if (!existsSync(tmpDir)) {
    mkdirSync(tmpDir, { recursive: true });
  }

  const zipFile = tmpDir + '/clearurls.zip';
  const tmpClearUrlsPath = path.join(tmpDir);
  const extensionsDir = join(process.cwd(), 'extensions');
  const clearUrlsDir = join(extensionsDir, 'clearurls');

  const downloadUrlToDirectory = (url, dir) =>
    fetch(url).then(
      (response) =>
        new Promise((resolve, reject) => {
          // @ts-ignore
          Readable.fromWeb(response.body)
            .pipe(createWriteStream(dir))
            .on('error', reject)
            .on('finish', resolve);
        }),
    );

  if (existsSync(clearUrlsDir)) {
    await deleteAsync(clearUrlsDir);
  }
  const data = await fetch(
    'https://api.github.com/repos/ClearURLs/Addon/releases/latest',
  );
  const json = await data.json();

  await downloadUrlToDirectory(json.assets[0].browser_download_url, zipFile);
  await unzip(zipFile, { dir: tmpDir });
  await moveFile(join(tmpClearUrlsPath), join(extensionsDir, 'clearurls'));
  await deleteAsync(zipFile, { force: true }).catch((err) => {
    console.warn('Could not delete temporary download file: ' + err.message);
  });
})();
