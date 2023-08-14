#!/usr/bin/env node
import clear from 'clear';
import chalk from 'chalk';
import figlet from 'figlet';
import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { S3Client, ListBucketsCommand, ListObjectsCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { writeFile } from 'node:fs/promises';

// // const config = {
// //     credentials: {
// //       accessKeyId: S3_API_KEY,
// //       secretAccessKey: S3_API_SECRET,
// //     },
// //     region: S3_REGION,
// //     signatureVersion: "v4",
// //   }

const config = {
  credentials: {
    accessKeyId: "",
    secretAccessKey: "",
  },
  signatureVersion: "v4",
};

clear()

console.log(
  chalk.yellow.bold(
    figlet.textSync('S3 Util', {
      horizontalLayout: 'full'
    })
  )
)
const program = new Command();

program
  .name('s3-util')
  .description('CLI to some JavaScript string utilities')
  .version('0.1.0');

// EXAMPLE
// program.command('split')
//   .description('Split a string into substrings and display as an array')
//   .argument('<string>', 'string to split')
//   .option('--first', 'display just the first substring')
//   .option('-s, --separator <char>', 'separator character', ',')
//   .action((str, options) => {
//     const limit = options.first ? 1 : undefined;
//     console.log(str.split(options.separator, limit));
//   });

program.command('list')
  .description('list buckets')
  .action(async (str, options) => {
    try {
        const client = new S3Client(config);
        const input = {};
        const command = new ListBucketsCommand(input);
        const res = await client.send(command);
        const {Buckets} = res;

        console.log(Buckets.map((bucket) => bucket.Name));
    } catch (err) {
        console.error(err);
    }
  });

program.command('contents')
  .description('list contents of bucket')
  .argument('<bucket_name>', 'bucket to query')
  .action(async (str, options) => {
    try {
        const client = new S3Client(config);
        const input = {
            Bucket: str
        };
        const command = new ListObjectsCommand(input);
        const res = await client.send(command);
        const {Contents} = res;
        console.log(Contents.map((content) => content.Key));
    } catch (err) {
        console.error(err);
    }
  });

program.command('download')
  .description('download object by key')
  .argument('<bucket_name>', 'bucket object where object is found')
  .argument('<key>', 'key to download')
  .action(async (bucket, key, options) => {
    console.time('Download File');
    try {
        const client = new S3Client(config);
        const input = {
            Bucket: bucket,
            Key: key,
        };
        const command = new GetObjectCommand(input);
        const res = await client.send(command);
        await writeFile(key, res.Body);
    } catch (err) {
        console.error(err);
    }
    console.timeEnd('Download File');
  });

program.command('copy')
  .description('copy file from provided source to provided target')
  .argument('<file_name>', 'name of file')
  .argument('<source_dir>', 'current location of file, ie. \./')
  .argument('<target_dir>', 'new location for file, ie. \./test')
  .action(async (file, source, destination, options) => {
    console.time('Copy File');

    const ensureDirectoryExistence = (filePath) => {
      let dirname = path.dirname(filePath);
      if (fs.existsSync(dirname)) {
          return true;
      }
      ensureDirectoryExistence(dirname);
      fs.mkdirSync(dirname);
    }
    ensureDirectoryExistence( destination + '/' + file);

    fs.copyFile(source + file, destination + '/' + file, (err) => {
      if (err) throw console.error(err);;
      console.log(source + file + ' was copied to ' +  destination + file);
    });

    console.timeEnd('Copy File');
  });

program.parse();