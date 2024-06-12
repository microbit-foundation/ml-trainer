enum RequestType {
  RequestTypeNone,
  RequestTypeLogLength,
  RequestTypeLogRead,
}

export enum RequestFormat {
  RequestLogHTMLHeader,
  RequestLogHTML,
  RequestLogCSV,
}

type RequestWrite = (view: DataView) => void;

interface ILogDataProcessor {
  getLogData: () => void;
  processReply: (reply: DataView) => void;
}

export class LogDataProcessor implements ILogDataProcessor {
  private jobLowErr = 0x0f;
  private job = 0;
  private jobLow = 0;
  private requestType: RequestType = RequestType.RequestTypeNone;
  private index = 0;
  private length = 0;
  private received = 0;
  private batch = 4; // If > 4, nearly every batch has to wait for a free slot
  private batchLength = 0;
  private batchReceived = 0;
  private data: Uint8Array | null = null;
  private format: RequestFormat;
  private reserved = 0;
  private requestWrite: RequestWrite;

  constructor(format: RequestFormat, requestWrite: RequestWrite) {
    this.format = format;
    this.requestWrite = requestWrite;
  }

  getLogData = () => {
    const view = this.createLogLengthDataView();
    this.requestWrite(view);
  };

  private createLogLengthDataView = (): DataView => {
    this.index = 0;
    this.length = 0;
    this.received = 0;
    this.requestType = RequestType.RequestTypeLogLength;
    // Force overflow to zero if needed.
    if (this.job === 0xf0) {
      this.job = 0;
    } else {
      this.job += 0x10;
    }
    this.jobLow = 0;

    // https://github.com/microbit-foundation/microbit-ios/blob/2da377987e68e12983cb83c8c1989aa1884bf4b9/Source/MicroBitUtilityTypes.h#L30
    const view = new DataView(new ArrayBuffer(3));
    // job
    view.setUint8(0, this.job);
    // request type; 0 = requestTypeNone, 1 = requestTypeLogLength, 2 = requestTypeLogRead
    view.setUint8(1, this.requestType);
    // format: 0 = HTML header; 1 = HTML; 2 = CSV.
    view.setUint8(2, this.format);
    return view;
  };

  private createLogReadDataView = (): DataView => {
    if (!this.length) {
      throw new Error('Missing log length. Cannot retrieve log data.');
    }
    this.batchReceived = 0;
    this.batchLength = this.length - this.received;
    if (this.batchLength > 19 * this.batch) {
      this.batchLength = 19 * this.batch;
    }
    this.requestType = RequestType.RequestTypeLogRead;
    // Force overflow to zero if needed.
    if (this.job === 0xf0) {
      this.job = 0;
    } else {
      this.job += 0x10;
    }
    this.jobLow = 0;

    // https://github.com/microbit-foundation/microbit-ios/blob/2da377987e68e12983cb83c8c1989aa1884bf4b9/Source/MicroBitUtilityTypes.h#L30
    const view = new DataView(new ArrayBuffer(16));
    // job
    view.setUint8(0, this.job);
    // request type; 0 = requestTypeNone, 1 = requestTypeLogLength, 2 = requestTypeLogRead
    view.setUint8(1, this.requestType);
    // format: 0 = HTML header; 1 = HTML; 2 = CSV.
    view.setUint8(2, this.format);
    // reserved: set to zero.
    view.setUint8(3, this.reserved);
    // index: unsigned integer index into file.
    view.setUint32(4, this.index, true);
    // batchlen: unsigned size in bytes to return.
    view.setUint32(8, this.batchLength, true);
    // length: length of whole file, from request type 1 (Log file length)
    view.setUint32(12, this.length, true);
    return view;
  };

  private logLengthProcess(data: ArrayBuffer, dataLength: number): void {
    if (dataLength < 4) {
      throw new Error('No data in response');
    }
    // Is there a better way to do this?
    const logLength = new DataView(data).getUint32(0, true);
    this.length = logLength;
    this.index = 0;
    this.received = 0;

    const view = this.createLogReadDataView();
    this.requestWrite(view);
  }

  private logReadProcess(data: ArrayBuffer, dataLength: number): void {
    if (dataLength < 1) {
      throw new Error('No data in response');
    }

    // There's probably a better way to manage this?
    if (this.data) {
      const dataToAppend = new Uint8Array(data);
      this.data = new Uint8Array([...this.data, ...dataToAppend]);
    } else {
      this.data = new Uint8Array(data);
    }

    this.received += dataLength;
    this.batchReceived += dataLength;

    if (this.batchReceived === this.batchLength) {
      this.index += this.batchReceived;

      if (this.received === this.length) {
        const dataAsCsv = new TextDecoder().decode(this.data);
        console.log('Imported log data:');
        console.log(dataAsCsv);
      }

      const view = this.createLogReadDataView();
      this.requestWrite(view);
    }
  }

  processReply(reply: DataView): void {
    const replyLength = reply.byteLength;

    if (!length) {
      throw new Error('No response');
    }

    const job = reply.getUint8(0);
    if ((job & 0xf0) !== this.job) {
      // Not clear if we should throw here?
      throw new Error('Ignore if not the current job');
    }

    if ((job & 0x0f) === this.jobLowErr) {
      const errorCode = reply.getInt32(1, true);
      throw new Error(`Reply is error. Error code: ${errorCode}`);
    }

    if ((job & 0x0f) !== this.jobLow) {
      // Not clear if we should throw here?
      throw new Error('Reply is out of order');
    }

    this.jobLow++;
    if (this.jobLow === 0x0f) {
      this.jobLow = 0;
    }

    const data = reply.buffer.slice(1);
    const dataLength = replyLength - 1;

    switch (this.requestType) {
      case RequestType.RequestTypeLogLength: {
        this.logLengthProcess(data, dataLength);
        break;
      }
      case RequestType.RequestTypeLogRead: {
        this.logReadProcess(data, dataLength);
        break;
      }
      case RequestType.RequestTypeNone: {
        break;
      }
      default:
        throw new Error('Unknown request type');
    }
  }
}
