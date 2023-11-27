const fs = require('fs');
const PDFDocument = require('pdfkit');

//o parâmetro é um array de objetos que tem 
//[0] = produto <String>
//[1] = quantidade <Number>
//[2] = valor <Number>
export function gerarRelatorioPDF(vendas) {
  const doc = new PDFDocument();
  const archiveName = 'relatorio_vendas.pdf';

  doc.pipe(fs.createWriteStream(archiveName));

  doc.fontSize(16).text('Relatório de Vendas', { align: 'center' });
  doc.moveDown();

  doc.fontSize(14).text('Detalhes das Vendas:');
  doc.moveDown();


  vendas.forEach((venda, index) => {
    doc.text(`${index + 1}. Produto: ${venda.produto}, Quantidade: ${venda.quantidade}, Valor: ${venda.valor}`);
  });


  const totalVendas = vendas.reduce((total, venda) => total + venda.quantidade * venda.valor, 0);

  doc.moveDown();
  doc.fontSize(14).text(`Total de Vendas: ${totalVendas}`, { align: 'right' });

  doc.end();

}