import { docs } from '../auth/google.js';

export async function appendContent(args: any) {
  const { documentId, content, heading, appendNewline = true } = args;

  try {
    const doc = await docs.documents.get({ documentId });
    const bodyContent = doc.data.body?.content;
    let endIndex = 1;
    
    if (bodyContent && bodyContent.length > 0) {
        const lastElement = bodyContent[bodyContent.length - 1];
        endIndex = lastElement.endIndex ? lastElement.endIndex - 1 : 1;
    }

    const requests = [];
    let textToInsert = '';
    
    if (heading) {
        textToInsert += `${heading}\n`;
    }
    
    textToInsert += content;
    
    if (appendNewline) {
        textToInsert += '\n';
    }

    requests.push({
      insertText: {
        location: { index: endIndex },
        text: textToInsert
      }
    });

    const response = await docs.documents.batchUpdate({
      documentId,
      requestBody: { requests }
    });

    return {
      success: true,
      documentId,
      endIndex,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to append to document'
    };
  }
}

export async function appendMultiple(args: any) {
  const { documentId, items } = args;
  
  let successCount = 0;
  const failedItems = [];
  
  for (const item of items) {
      const result = await appendContent({
          documentId,
          content: item.content,
          heading: item.heading,
          appendNewline: true
      });
      
      if (result.success) {
          successCount++;
      } else {
          failedItems.push({
              item,
              error: result.error
          });
      }
  }
  
  return {
      success: failedItems.length === 0,
      documentId,
      itemsAppended: successCount,
      failedItems,
      timestamp: new Date().toISOString()
  };
}
