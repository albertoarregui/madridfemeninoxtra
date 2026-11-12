import * as contentful from 'contentful';
import { runtimeEnv } from './runtime-env';

export const contentfulClient = contentful.createClient({
    space: runtimeEnv('CONTENTFUL_SPACE_ID') ?? '',
    accessToken: runtimeEnv('CONTENTFUL_ACCESS_TOKEN') ?? '',
});
