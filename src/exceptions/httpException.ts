class HttpException {
  public type: string;
  public statusCode: number;
  public message: string;

  constructor(type: string, statusCode: number, message: string) {
    this.message = message;
    this.statusCode = statusCode;
    this.type = type;
  }
}

export default HttpException;
