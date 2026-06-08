"use client";

import React from 'react';
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";
import DocxPreviewRenderer from './DocxPreviewRenderer';

export default function DocumentViewerWrapper({ url }: { url: string }) {
  const docs = [
    { uri: url }
  ];

  const isDocx = url.toLowerCase().endsWith('.docx');

  if (isDocx) {
    return (
      <div className="w-full h-full bg-gray-100 overflow-hidden">
        <DocxPreviewRenderer url={url} />
      </div>
    );
  }

  return (
    <DocViewer 
      documents={docs} 
      pluginRenderers={DocViewerRenderers} 
      style={{ width: '100%', height: '100%' }}
      config={{
        header: {
          disableHeader: true,
          disableFileName: true,
          retainURLParams: false
        }
      }}
    />
  );
}
