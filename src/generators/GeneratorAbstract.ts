import { existsSync } from 'fs';
import { EditorInput } from '../models/editor/EditorInput';
import { fixPath, makeDirIfNotExist } from '../helpers/generatorHelpers';
import { getAllEditors, getApiPaths, getAllEditorInputsByEditors, capitalize } from '../helpers';
import { OpenApiDocument, Editor, ApiPath, EditorPrimitiveInput, EditorObjectInput } from '../models/index';
import rimraf from 'rimraf';
import GeneratorsOptions from '../models/GeneratorsOptions';
import { join } from 'path';

export abstract class GeneratorAbstract {
    editors: Editor[];
    apiPaths: ApiPath[];
    controllersNames: string[];
    allEditorInputs: EditorInput[];
    modelsFolder = join(this.options.output, this.options.modelsFolderName);
    controllersFolder = join(this.options.output, this.options.controllersFolderName);

    constructor(public swagger: OpenApiDocument, public options: GeneratorsOptions) {
        if (!options.pathOrUrl) {
            throw new Error('pathOrUrl is required');
        }
        if (!options.output) {
            throw new Error('output is required');
        }
        if (!options.generator) {
            throw new Error('generator is required');
        }
        if (!options.type) {
            throw new Error('type is required');
        }

        options.modelsFolderName = options.modelsFolderName || '';
        options.modelNamePrefix = options.modelNamePrefix || '';
        options.modelNameSuffix = options.modelNameSuffix || '';
        options.controllersFolderName = options.controllersFolderName || '';
        options.controllerNamePrefix = options.controllerNamePrefix || '';
        options.controllerNameSuffix = options.controllerNameSuffix || '';
        options.namepsace = options.namepsace || '';

        this.swagger = swagger;
        this.editors = getAllEditors(swagger);
        this.apiPaths = getApiPaths(swagger);
        this.options.output = fixPath(options.output);
        this.controllersNames = [...new Set(this.apiPaths.map(x => x.controller))];
        this.allEditorInputs = getAllEditorInputsByEditors(this.editors);
    }
    async generate(): Promise<void> {
        console.log('-----  start generating -----');
        rimraf.sync(this.options.output);
        makeDirIfNotExist(this.options.output);
        makeDirIfNotExist(this.modelsFolder);
        makeDirIfNotExist(this.controllersFolder);
        console.log('-----  start generating object models -----');
        for (const editorInput of this.allEditorInputs.filter(x => x.editorType === 'EditorObjectInput')) {
            const objectInput = editorInput as EditorObjectInput;
            if (objectInput.isDictionary) {
                continue;
            }
            await this.generateObject(objectInput);
        }
        console.log('-----  start generating enum models -----');
        for (const editorInput of this.allEditorInputs.filter(x => x.editorType === 'EditorPrimitiveInput')) {
            const primitiveInput = editorInput as EditorPrimitiveInput;
            if (primitiveInput.enumNames.length + primitiveInput.enumsOptions.length + primitiveInput.enumValues.length <= 0) {
                continue;
            }
            const enumVals = {};
            if (primitiveInput.enumNames.length === primitiveInput.enumValues.length) {
                for (let i = 0; i < primitiveInput.enumNames.length; i++) {
                    enumVals[primitiveInput.enumNames[i]] = primitiveInput.enumValues[i];
                }
            } else {
                primitiveInput.enumsOptions.forEach(x => (enumVals[x] = x));
            }
            await this.generateEnum(primitiveInput, enumVals);
        }
        console.log('----- start generating controllers -----');
        for (const controllerName of this.controllersNames) {
            const controllerPaths = this.apiPaths.filter(x => x.controller === controllerName);
            console.log(`${controllerName} - ${controllerPaths.length}`);
            await this.generateController(controllerName, controllerPaths);
        }
        console.log('----- start generating client -----');
        this.generateClient();
        console.log('----- done -----');
    }
    shouldGenerateModel(editorInput: EditorInput) {
        makeDirIfNotExist(this.modelsFolder);
        const modelFile = join(this.modelsFolder, this.getFileName(editorInput) + this.getFileExtension(true));
        if (existsSync(modelFile)) {
            return false;
        }
        return true;
    }
    getFileName(editorInput: EditorInput) {
        let name = editorInput.className || (editorInput as any).definistionName || editorInput.title;
        if (!name || name === 'undefined' || name === '') {
            name = undefined;
        }
        if (!name && editorInput.editorType === 'EditorPrimitiveInput' && (editorInput as EditorPrimitiveInput).enumsOptions.length > 0) {
            name = editorInput.name;
        }
        if (!name || name === 'undefined' || name === '') {
            return undefined;
        }
        return this.options.modelNamePrefix + capitalize(name) + this.options.modelNameSuffix.split('.')[0];
    }
    getControllerName(controllerName: string) {
        return `${this.options.controllerNamePrefix}${capitalize(controllerName)}${this.options.controllerNameSuffix}`;
    }
    getFileAdditionalExtension() {
        const suffix = this.options.modelNameSuffix.split('.').filter(x => x);
        if (suffix.length < 1) {
            return '';
        }
        return ('.' + this.options.modelNameSuffix.split('.').slice(1).join('.')).replace('..ts', '');
    }
    generateControllerMethodsContent(controller: string, controllerPaths: ApiPath[]): string {
        let content = '';
        for (const controllerPath of controllerPaths) {
            console.log(`\t${controllerPath.method} - ${controllerPath.path}`);
            content += this.generateControllerMethodContent(controller, controllerPath);
        }
        return content;
    }
    getMethodName(controllerPath: ApiPath) {
        const cleanRegex = /\/|-|{|}|\.|_/g;
        const longName = controllerPath.method.toLowerCase() + capitalize(controllerPath.path.replace(cleanRegex, ''));
        if (this.options.longMethodName) {
            return longName;
        }
        let shortName = '';
        try {
            shortName = controllerPath.path.split('?')[0];
            shortName = shortName.toLowerCase().startsWith('/api') ? shortName.substring(4) : shortName;
            shortName =
                shortName.split(`/${controllerPath.controller}/`).length <= 1
                    ? shortName
                    : shortName.split(`/${controllerPath.controller}/`).slice(1).join(`/${controllerPath.controller}/`);
            shortName = shortName.replace(cleanRegex, '');
            shortName = !(shortName || '').trim() ? '' : controllerPath.method.toLowerCase() + capitalize(shortName);
        } catch {}
        return !shortName ? longName : shortName.trim();
    }
    abstract getFileExtension(isModel: boolean);
    abstract generateObject(objectInput: EditorObjectInput): void;
    abstract generateEnum(enumInput: EditorPrimitiveInput, enumVals: { [name: string]: string | number }): void;
    abstract generateController(controller: string, controllerPaths: ApiPath[]): void;
    abstract generateControllerMethodContent(controller: string, controllerPath: ApiPath): string;
    abstract generateClient(): void;
}
