import { Response } from 'express';

export const setupSSEStream = (res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  });
  res.flushHeaders();

  return {
    send: (event: string, data: any) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      // Use res.flush() if using compression middleware
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    },
    close: () => {
      res.write('event: close\ndata: {}\n\n');
      res.end();
    }
  };
};
