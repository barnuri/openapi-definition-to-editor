import { EditorArrayInput, EditorInput, EditorObjectInput, EditorPrimitiveInput } from 'openapi-definition-to-editor';
import * as React from 'react';
import EditorArrayInputComponent from './EditorArrayInputComponent';
import EditorPrimitiveInputComponent from './EditorPrimitiveInputComponent';
import EditorObjectInputComponent from './EditorObjectInputComponent';
import EditorProps from './EditorProps';

const EditorInputComponent = ({ editorInput, changes, setChanges, value }: EditorProps & { editorInput: EditorInput }) => {
    if (editorInput.editorType === 'EditorPrimitiveInput') {
        return <EditorPrimitiveInputComponent changes={changes} primitiveInput={editorInput as EditorPrimitiveInput} setChanges={setChanges} value={value} />;
    }
    if (editorInput.editorType === 'EditorArrayInput') {
        return <EditorArrayInputComponent changes={changes} arrayInput={editorInput as EditorArrayInput} setChanges={setChanges} value={value} />;
    }
    return <EditorObjectInputComponent changes={changes} objectInput={editorInput as EditorObjectInput} setChanges={setChanges} value={value} />;
};

export default EditorInputComponent;
