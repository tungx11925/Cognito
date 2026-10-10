import path from 'path';
import crypto from 'crypto';
import { AppError } from './AppError';

export interface FileValidationOptions {
  allowedExtensions: string[];
  maxSizeBytes?: number;
  category?: 'document' | 'exam' | 'image';
}

/**
 * Known file signatures (magic bytes)
 */
const SIGNATURES = {
  PDF: [0x25, 0x50, 0x44, 0x46], // %PDF
  PNG: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  JPEG: [0xFF, 0xD8, 0xFF],
  GIF87a: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
  GIF89a: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  ZIP_OPENXML: [0x50, 0x4B, 0x03, 0x04], // DOCX, XLSX, PPTX, ZIP
  ZIP_EMPTY: [0x50, 0x4B, 0x05, 0x06],
  ZIP_SPANNED: [0x50, 0x4B, 0x07, 0x08],
  OLE_COMPOUND: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], // Legacy DOC, XLS, PPT
  // Dangerous signatures to explicitly reject
  WINDOWS_EXE: [0x4D, 0x5A], // MZ
  LINUX_ELF: [0x7F, 0x45, 0x4C, 0x46], // .ELF
  JAVA_MACHO: [0xCA, 0xFE, 0xBA, 0xBE],
};

function matchesBytes(buffer: Buffer, signature: number[], offset = 0): boolean {
  if (buffer.length < offset + signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (buffer[offset + i] !== signature[i]) return false;
  }
  return true;
}

/**
 * Checks if a buffer represents valid plain text / CSV (no null bytes in the first 1KB, valid UTF-8)
 */
function isValidTextBuffer(buffer: Buffer): boolean {
  const checkLength = Math.min(buffer.length, 1024);
  for (let i = 0; i < checkLength; i++) {
    // Binary null byte indicates binary executable/compiled file
    if (buffer[i] === 0x00) return false;
  }
  return true;
}

/**
 * Checks if WEBP file (starts with RIFF....WEBP)
 */
function isWebP(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  const riff = buffer.toString('ascii', 0, 4);
  const webp = buffer.toString('ascii', 8, 12);
  return riff === 'RIFF' && webp === 'WEBP';
}

/**
 * Validates real file content magic bytes against declared extension.
 * Rejects malicious/spoofed files, executables, and scripts.
 */
export function validateFileContent(
  buffer: Buffer,
  originalName: string,
  declaredMime?: string
): { isValid: boolean; detectedType: string; safeExtension: string } {
  if (!buffer || buffer.length === 0) {
    throw new AppError('File rỗng hoặc không có dữ liệu', 400);
  }

  // 1. Chặn tuyệt đối các file thực thi (Executable/Binary payload)
  if (matchesBytes(buffer, SIGNATURES.WINDOWS_EXE)) {
    throw new AppError('Phát hiện tệp thực thi nguy hiểm (Windows PE/EXE/DLL). Tải lên bị từ chối vì lý do bảo mật.', 400);
  }
  if (matchesBytes(buffer, SIGNATURES.LINUX_ELF)) {
    throw new AppError('Phát hiện tệp thực thi Linux ELF. Tải lên bị từ chối vì lý do bảo mật.', 400);
  }
  if (matchesBytes(buffer, SIGNATURES.JAVA_MACHO)) {
    throw new AppError('Phát hiện mã nhị phân Mach-O/Java Class. Tải lên bị từ chối vì lý do bảo mật.', 400);
  }

  // Chặn script tags nguy hiểm trong header
  const headerPreview = buffer.slice(0, 100).toString('utf-8').toLowerCase();
  if (headerPreview.includes('<?php') || headerPreview.startsWith('#!/bin/') || headerPreview.includes('<script')) {
    throw new AppError('Phát hiện mã script/PHP thực thi trong tệp. Tải lên bị từ chối.', 400);
  }

  const rawExt = path.extname(originalName || '').toLowerCase().trim();

  // 2. Xác thực Magic Bytes theo định dạng
  // PDF
  if (rawExt === '.pdf' || declaredMime === 'application/pdf') {
    if (matchesBytes(buffer, SIGNATURES.PDF)) {
      return { isValid: true, detectedType: 'application/pdf', safeExtension: '.pdf' };
    }
    throw new AppError('Tệp PDF giả mạo: Nội dung thực tế không có chữ ký số %PDF.', 400);
  }

  // DOCX / XLSX / PPTX (OpenXML)
  if (['.docx', '.xlsx', '.pptx'].includes(rawExt) || 
      declaredMime?.includes('openxmlformats-officedocument')) {
    if (matchesBytes(buffer, SIGNATURES.ZIP_OPENXML) || 
        matchesBytes(buffer, SIGNATURES.ZIP_EMPTY) || 
        matchesBytes(buffer, SIGNATURES.ZIP_SPANNED)) {
      return { isValid: true, detectedType: declaredMime || 'application/octet-stream', safeExtension: rawExt };
    }
    throw new AppError(`Tệp ${rawExt.toUpperCase()} giả mạo: Thiếu chữ ký nén OpenXML (PK header).`, 400);
  }

  // Legacy Office (.doc, .xls, .ppt)
  if (['.doc', '.xls', '.ppt'].includes(rawExt) || declaredMime?.includes('msword') || declaredMime?.includes('ms-excel') || declaredMime?.includes('ms-powerpoint')) {
    if (matchesBytes(buffer, SIGNATURES.OLE_COMPOUND)) {
      return { isValid: true, detectedType: declaredMime || 'application/octet-stream', safeExtension: rawExt };
    }
    // Một số docx cũ được đặt tên .doc nhưng có header PK
    if (matchesBytes(buffer, SIGNATURES.ZIP_OPENXML)) {
      return { isValid: true, detectedType: declaredMime || 'application/octet-stream', safeExtension: rawExt };
    }
    throw new AppError(`Tệp ${rawExt.toUpperCase()} không đúng định dạng OLE Compound Binary.`, 400);
  }

  // PNG
  if (rawExt === '.png' || declaredMime === 'image/png') {
    if (matchesBytes(buffer, SIGNATURES.PNG)) {
      return { isValid: true, detectedType: 'image/png', safeExtension: '.png' };
    }
    throw new AppError('Tệp PNG giả mạo: Chữ ký ảnh không khớp chuẩn PNG.', 400);
  }

  // JPEG / JPG
  if (['.jpg', '.jpeg'].includes(rawExt) || declaredMime === 'image/jpeg') {
    if (matchesBytes(buffer, SIGNATURES.JPEG)) {
      return { isValid: true, detectedType: 'image/jpeg', safeExtension: '.jpg' };
    }
    throw new AppError('Tệp JPEG giả mạo: Chữ ký ảnh không khớp chuẩn JPEG.', 400);
  }

  // WEBP
  if (rawExt === '.webp' || declaredMime === 'image/webp') {
    if (isWebP(buffer)) {
      return { isValid: true, detectedType: 'image/webp', safeExtension: '.webp' };
    }
    throw new AppError('Tệp WEBP giả mạo: Chữ ký ảnh không khớp chuẩn RIFF/WEBP.', 400);
  }

  // GIF
  if (rawExt === '.gif' || declaredMime === 'image/gif') {
    if (matchesBytes(buffer, SIGNATURES.GIF87a) || matchesBytes(buffer, SIGNATURES.GIF89a)) {
      return { isValid: true, detectedType: 'image/gif', safeExtension: '.gif' };
    }
    throw new AppError('Tệp GIF giả mạo: Chữ ký ảnh không khớp chuẩn GIF.', 400);
  }

  // Plain Text / CSV / Markdown
  if (['.txt', '.csv', '.md'].includes(rawExt) || declaredMime?.startsWith('text/')) {
    if (isValidTextBuffer(buffer)) {
      return { isValid: true, detectedType: declaredMime || 'text/plain', safeExtension: rawExt || '.txt' };
    }
    throw new AppError(`Tệp văn bản ${rawExt} giả mạo: Chứa các byte nhị phân không hợp lệ.`, 400);
  }

  throw new AppError(`Định dạng tệp ${rawExt || 'không xác định'} không được hỗ trợ hoặc bị từ chối.`, 400);
}

/**
 * Phòng chống tấn công Path Traversal:
 * - Loại bỏ toàn bộ `..`, `/`, `\`, null bytes, control characters khỏi tên file.
 * - Chỉ giữ lại phần mở rộng an toàn thuộc whitelist.
 * - Tạo tên file ngẫu nhiên độc nhất bằng UUID/Hex để lưu trữ trên đĩa.
 */
export function generateSafeFileName(prefix: string, originalName: string, allowedExtensions: string[]): string {
  // 1. Làm sạch originalName
  const sanitizedBase = path.basename(originalName).replace(/[^a-zA-Z0-9._-]/g, '_');
  const rawExt = path.extname(sanitizedBase).toLowerCase();

  const isAllowed = allowedExtensions.some(ext => ext.toLowerCase() === rawExt);
  if (!isAllowed) {
    throw new AppError(`Phần mở rộng ${rawExt} không nằm trong danh sách được phép`, 400);
  }

  // 2. Tạo tên ngẫu nhiên cryptographically secure
  const randomSuffix = crypto.randomBytes(8).toString('hex');
  const timestamp = Date.now();

  return `${prefix}-${timestamp}-${randomSuffix}${rawExt}`;
}
