// Person matte with Apple Vision (free, local). Reads raw BGRA frames of <w>x<h> on stdin and
// writes one raw 8-bit matte per frame (255 = person) of the same size on stdout.
// Usage: ffmpeg ... -f rawvideo -pix_fmt bgra - | matte <w> <h> > mattes.raw
import Foundation
import Vision
import CoreImage
import CoreVideo

let args = CommandLine.arguments
guard args.count == 3, let w = Int(args[1]), let h = Int(args[2]) else {
  FileHandle.standardError.write("usage: matte <w> <h>\n".data(using: .utf8)!); exit(1)
}
let frameBytes = w * h * 4
let input = FileHandle.standardInput
let output = FileHandle.standardOutput
let ctx = CIContext(options: [.useSoftwareRenderer: false])
let request = VNGeneratePersonSegmentationRequest()
request.qualityLevel = .accurate
request.outputPixelFormat = kCVPixelFormatType_OneComponent8
let gray = CGColorSpaceCreateDeviceGray()

while true {
  var data = Data()
  while data.count < frameBytes {
    let chunk = input.readData(ofLength: frameBytes - data.count)
    if chunk.isEmpty { break }
    data.append(chunk)
  }
  if data.count < frameBytes { break }
  var pb: CVPixelBuffer?
  CVPixelBufferCreate(nil, w, h, kCVPixelFormatType_32BGRA, nil, &pb)
  guard let buf = pb else { exit(2) }
  CVPixelBufferLockBaseAddress(buf, [])
  let dst = CVPixelBufferGetBaseAddress(buf)!
  let rowBytes = CVPixelBufferGetBytesPerRow(buf)
  data.withUnsafeBytes { raw in
    for y in 0..<h { memcpy(dst + y * rowBytes, raw.baseAddress! + y * w * 4, w * 4) }
  }
  CVPixelBufferUnlockBaseAddress(buf, [])
  let handler = VNImageRequestHandler(cvPixelBuffer: buf, options: [:])
  try? handler.perform([request])
  var out = Data(count: w * h)
  if let mask = request.results?.first?.pixelBuffer {
    let ci = CIImage(cvPixelBuffer: mask)
    let sx = CGFloat(w) / ci.extent.width, sy = CGFloat(h) / ci.extent.height
    let scaled = ci.transformed(by: CGAffineTransform(scaleX: sx, y: sy))
    out.withUnsafeMutableBytes { p in
      ctx.render(scaled, toBitmap: p.baseAddress!, rowBytes: w, bounds: CGRect(x: 0, y: 0, width: w, height: h), format: .L8, colorSpace: gray)
    }
  }
  output.write(out)
}
