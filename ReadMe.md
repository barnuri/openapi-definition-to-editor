# Install

```bash
npm i openapi-definition-to-editor
```

# Example of using

## Download this file

https://raw.githubusercontent.com/barnuri/openapi-definition-to-editor/master/src/openapiSchemaExample.json

## Then use this code

```js
import { writeFileSync } from 'fs';
import openapiSchemaExample from './openapiSchemaExample.json';
import { editorInputToHtml, getEditor, OpenApiDocument } from 'openapi-definition-to-editor';

const editors = ['Order', 'User', 'Category', 'Tag', 'Pet', 'ApiResponse'].map(tabName => getEditor((openapiSchemaExample as any) as OpenApiDocument, tabName));
const html = editorInputToHtml(editors);
writeFileSync('./openapiSchemaExample.result.json', JSON.stringify(editors, undefined, 4), 'utf-8');
writeFileSync('./openapiSchemaExample.html', html, 'utf-8');
var start = process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open';
require('child_process').exec(start + ' ' + './openapiSchemaExample.html');

```

## Result

![Example](https://github.com/barnuri/openapi-definition-to-editor/blob/master/ex.png?raw=true)

# Look at editorInputToHtml.ts to handle editors by yourself

[editorInputToHtml.ts](src/converters/editorInputToHtml.ts)
