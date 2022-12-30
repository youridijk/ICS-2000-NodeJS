import * as fs from 'fs';
import path from 'path';

export default function loadEnv(filePath?: fs.PathLike) {
  if (filePath == null) {
    filePath = path.resolve(`${__dirname}/../.env`);
  }

  console.log('Setting up .env file!');

  if (fs.existsSync(filePath)) {
    const envFile = fs.readFileSync(filePath, 'utf-8');

    for (const line of envFile.split(/[\r\n]+/)) {
      const lineParts = line.split('=');
      const key = lineParts [0];
      process.env[key] = lineParts[1];
    }
    console.log('.env file loaded into process.env');
  } else {
    console.log('.env file not found!');
  }
}
