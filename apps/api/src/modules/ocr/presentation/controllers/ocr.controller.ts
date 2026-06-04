import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ZodValidationPipe } from "nestjs-zod";
import { z } from "zod";
import type { OcrContractResponse } from "@settlepass/api-contracts";
import { ProcessOcrUseCase } from "../../application/use-cases/process-ocr.use-case";

/**
 * 업로드 파일의 최소 형태(@types/multer 미설치 — Express.Multer.File 대신 직접 정의).
 * FileInterceptor 가 memory storage 로 buffer 를 채운다.
 */
interface UploadedContractFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB (사용자 노출 한도)
// 하드 백스톱: 메모리 폭주 방지를 위한 절대 상한(이보다 크면 multer 가 차단, 413).
// 사용자 노출용 10MB 초과 판정은 핸들러의 명시적 size 검사(→ 400)가 담당하므로,
// 백스톱은 노출 한도보다 충분히 크게 둬 10MB 초과 파일이 핸들러까지 도달하게 한다.
const HARD_LIMIT_BYTES = 25 * 1024 * 1024; // 25MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
];

const userDidSchema = z.string().min(1);

/**
 * multer fileFilter — 허용되지 않은 MIME 은 BadRequestException(→ 400)으로 거른다.
 * 핸들러의 명시적 검사와 중복되지만, 인터셉터 단계에서도 일관되게 400 을 보장한다.
 */
function contractFileFilter(
  _req: unknown,
  file: { mimetype: string },
  cb: (error: Error | null, acceptFile: boolean) => void,
): void {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(
      new BadRequestException(
        `unsupported file type: ${file.mimetype} (allowed: pdf, png, jpg, jpeg)`,
      ),
      false,
    );
    return;
  }
  cb(null, true);
}

@Controller("contracts")
export class OcrController {
  constructor(
    @Inject(ProcessOcrUseCase)
    private readonly processOcr: ProcessOcrUseCase,
  ) {}

  /**
   * POST /api/contracts/ocr — multipart(file? + userDid + manualText?).
   *
   * 파일은 메타데이터 파이프 대신 수동 검증한다(타입/크기). 파일이 있으면 허용 MIME 만 받고
   * 10MB 를 초과하면 거부한다. 파일이 없으면 manualText/fixture fallback 경로로 진행한다.
   * userDid 는 ZodValidationPipe 로 검증한다(없으면 400).
   */
  @Post("ocr")
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: HARD_LIMIT_BYTES },
      fileFilter: contractFileFilter,
    }),
  )
  async extract(
    @UploadedFile() file: UploadedContractFile | undefined,
    @Body("userDid", new ZodValidationPipe(userDidSchema)) userDid: string,
    @Body("manualText") manualText?: string,
  ): Promise<OcrContractResponse> {
    if (file) {
      // fileFilter 가 1차로 거르지만, 핸들러에서도 명시적으로 재검증한다(방어적).
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new BadRequestException(
          `unsupported file type: ${file.mimetype} (allowed: pdf, png, jpg, jpeg)`,
        );
      }
      // 사용자 노출 한도(10MB) 초과는 400 으로 거른다(HARD_LIMIT 미만이면 여기서 차단).
      if (file.size > MAX_FILE_BYTES) {
        throw new BadRequestException("file too large (max 10MB)");
      }
    }

    return this.processOcr.execute({
      userDid,
      file: file
        ? {
            buffer: file.buffer,
            filename: file.originalname,
            mimeType: file.mimetype,
          }
        : undefined,
      manualText,
    });
  }
}
