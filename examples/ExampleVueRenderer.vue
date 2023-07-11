<template>
    <div class="container">
        <json-forms 
        v-if="ready" 
        :data="data" 
        :schema="schema" 
        :uischema="uischema"
        :renderers="renderers" 
        @change="onChange" />
    </div>
</template>
<script lang="ts">
import { JsonForms } from '@jsonforms/vue';
import {
  defaultStyles,
  mergeStyles,
  vanillaRenderers,
} from '@jsonforms/vue-vanilla';
import { defineComponent } from 'vue';

import {CustomRendererEntry} from 'Path/to/custom/renderers'

// mergeStyles combines all classes from both styles definitions
const myStyles = mergeStyles(defaultStyles, {
    control: {
        root: 'control',
        wrapper: 'wrapper',
    },
    label: {
        root: 'label-element',
    },
});

const renderers = Object.freeze([
  ...vanillaRenderers,
  CustomRendererEntry
]);

export default defineComponent({
    name: 'app',
    components: {
        JsonForms,
    },
    data() {
        return {
            renderers: Object.freeze(renderers),
            ready: false,
            data: {},
            schema: undefined as any,
            uischema: undefined as any
        };
    },
    provide() {
        return {
            styles: myStyles,
        };
    },
    mounted() {
        this.configureListener();
        window.parent.postMessage("READY", "*");
    },
    methods: {
        configureListener() {
            window.addEventListener('message', event => {
                const msgType = this.determineMessage(event.data);

                switch (msgType) {
                    case MsgType.Schema:
                        this.schema = JSON.parse(this.decodeSchema(event.data));
                        this.ready = true;
                        break;
                    case MsgType.UiSchema:
                        this.uischema = JSON.parse(this.decodeUiSchema(event.data));
                        break;
                    case MsgType.Data:
                        this.data = JSON.parse(event.data.substring(5));
                        break;
                    default:
                        break;
                }
            });
        },
        onChange(event: any) {
            this.data = event.data;
            let dataMsg = JSON.stringify(this.data);
            window.parent.postMessage(`DATA:${dataMsg}`, "*");
        },
        determineMessage(message: string): MsgType {
            try {
                if (message) {
                    if (message.startsWith("SCHEMA:")) {
                        return MsgType.Schema;
                    }
                    else if (message.startsWith("UI_SCHEMA:")) {
                        return MsgType.UiSchema;
                    }
                    else if (message.startsWith("DATA")) {
                        return MsgType.Data;
                    }
                }
            }
            catch (e) {
                console.log(e);
            }

            return MsgType.Unknown;
        },
        decodeSchema(message: string): string {
            const encoded = message.substring(7);
            return atob(encoded);
        },
        decodeUiSchema(message: string): string {
            const encoded = message.substring(10);
            return atob(encoded);
        },
    },
});

enum MsgType{
  Schema,
  UiSchema,
  Data,
  Unknown
}
</script>