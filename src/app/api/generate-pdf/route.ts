import { compileBilingualInvoicePDF } from '@/lib/pdf';
import { PassThrough } from 'stream';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      items = [], 
      sessionTitle = '', 
      customerName = '', 
      invoiceDate = '', 
      destination = '', 
      dispatchedThrough = '', 
      termsOfDelivery = '', 
      consigneeName = '', 
      consigneeAddress = '', 
      consigneeGstin = '', 
      buyerAddress = '', 
      buyerGstin = '' 
    } = body;

    const docStream = new PassThrough();
    const chunks: any[] = [];

    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      docStream.on('data', (chunk) => chunks.push(chunk));
      docStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      docStream.on('error', (err) => {
        reject(err);
      });
    });

    compileBilingualInvoicePDF(
      items,
      sessionTitle,
      docStream,
      customerName,
      invoiceDate,
      destination,
      dispatchedThrough,
      termsOfDelivery,
      consigneeName,
      consigneeAddress,
      consigneeGstin,
      buyerAddress,
      buyerGstin
    );

    const buffer = await pdfPromise;
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Invoice-${Date.now()}.pdf`,
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
