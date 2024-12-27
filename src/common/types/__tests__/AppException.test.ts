import AppException from "../AppException";

describe('AppException', () => {
  it('has a name', () => {
    const name = 'TestException';
    const message = 'This is a test exception.';
    const exception = new AppException(name, message);
    expect(exception.name).toEqual(name);
  });

  it('has a message', () => {
    const name = 'TestException';
    const message = 'This is a test exception.';
    const exception = new AppException(name, message);
    expect(exception.message).toEqual(message);
  });

  it('can be constructed without a message', () => {
    const name = 'TestException';
    const exception = new AppException(name);
    expect(exception.message).toEqual('');
  });
});