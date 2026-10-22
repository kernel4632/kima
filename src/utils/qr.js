import qrcode from 'qrcode-generator';
// 编码器默认的单字节转换不支持中文；显式采用标准 UTF-8 字节。
qrcode.stringToBytes = value => Array.from(new TextEncoder().encode(value));
export function encodeQR(value, level = 'M') {
  const qr = qrcode(0, ['L', 'M', 'Q', 'H'].includes(level) ? level : 'M');
  qr.addData(String(value), 'Byte');
  qr.make();
  const size = qr.getModuleCount();
  const modules = Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, col) => qr.isDark(row, col)));
  const path = modules.flatMap((line, row) => line.flatMap((dark, col) => dark ? [`M${col + 4} ${row + 4}h1v1h-1z`] : [])).join('');
  return { size, modules, path, viewBox: `0 0 ${size + 8} ${size + 8}` };
}
