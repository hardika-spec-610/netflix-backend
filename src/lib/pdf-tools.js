import PdfPrinter from "pdfmake";
import imageToBase64 from "image-to-base64";

export const getPDFReadableStream = async (media) => {
  // Define font files
  const fonts = {
    Helvetica: {
      normal: "Helvetica",
      bold: "Helvetica-Bold",
      italics: "Helvetica-Oblique",
      bolditalics: "Helvetica-BoldOblique",
    },
  };
  const printer = new PdfPrinter(fonts);
  const imageToBase64Encoded = await imageToBase64(media.Poster);
  const docDefinition = {
    content: [
      { text: "Movie Search Results", style: "header" },
      { text: `${media.Title}`, style: "subheader" },
      { text: "\n" },
      {
        image: `data:image/jpeg;base64,${imageToBase64Encoded}`,
        width: 500,
        height: 500,
      },
      {
        type: "none",
        ol: [
          { text: `Title: ${media.Title}`, style: "tableBody" },
          { text: `Type: ${media.Type}`, style: "tableBody" },
          { text: `Year: ${media.Year}`, style: "tableBody" },
        ],
        style: "subheader",
      },
    ],
    defaultStyle: {
      font: "Helvetica",
    },
    styles: {
      header: {
        fontSize: 20,
        bold: true,
        margin: [0, 0, 0, 10],
      },
      subheader: {
        fontSize: 20,
        margin: [0, 12, 0, 5],
      },
      tableHeader: {
        bold: true,
        fontSize: 13,
        color: "black",
        fillColor: "#f2f2f2",
      },
      tableBody: {
        fontSize: 20,
        color: "black",
        bold: true,
        margin: [0, 12, 0, 5],
      },
    },
  };

  const pdfReadableStream = printer.createPdfKitDocument(docDefinition, {});
  pdfReadableStream.end();

  return pdfReadableStream;
};
