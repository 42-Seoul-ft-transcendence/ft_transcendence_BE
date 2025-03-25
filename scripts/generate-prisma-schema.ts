import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 파일 경로 정의
const baseSchemaPath = path.join(__dirname, '../prisma/base.prisma');
const enumsPath = path.join(__dirname, '../prisma/enums.prisma');
const modelsDirPath = path.join(__dirname, '../prisma/models');
const outputPath = path.join(__dirname, '../prisma/schema.prisma');

// 기본 스키마와 열거형 읽기
const baseSchema: string = fs.readFileSync(baseSchemaPath, 'utf-8');
const enums: string = fs.readFileSync(enumsPath, 'utf-8');

// 모든 모델 파일 읽기
const modelFiles: string[] = fs.readdirSync(modelsDirPath)
  .filter(file => file.endsWith('.prisma'));

let models: string = '';

// 각 모델 파일 내용을 합치기
modelFiles.forEach(file => {
  const modelPath: string = path.join(modelsDirPath, file);
  const modelContent: string = fs.readFileSync(modelPath, 'utf-8');
  models += modelContent + '\n\n';
});

// 모든 부분 결합
const finalSchema: string = `${baseSchema}

${enums}

${models}`;

// 최종 스키마 파일 작성
fs.writeFileSync(outputPath, finalSchema);

console.log('Generated schema.prisma successfully!');
