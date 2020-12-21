import { OpenApiDefinitionObject } from './../openapi/OpenApiDefinitionObject';
import { EditorInput } from './EditorInput';
export class EditorArrayInput extends EditorInput {
    public itemInput: EditorInput;
    public readonly maxItems: number | undefined;
    public readonly minItems: number | undefined;
    public readonly uniqueItems: boolean | undefined;

    constructor(
        itemInput: EditorInput,
        path: string,
        openApiDefinition: OpenApiDefinitionObject,
        openApiParentDefinition: OpenApiDefinitionObject | undefined,
    ) {
        super(path, 'EditorArrayInput', openApiDefinition, openApiParentDefinition);
        this.itemInput = itemInput;
        this.maxItems = openApiDefinition.maxItems;
        this.minItems = openApiDefinition.minItems;
        this.default = [];
    }
}
