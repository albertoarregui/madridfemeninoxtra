import * as contentful from 'contentful';
import { getRequestLocale } from '../i18n/request-locale';
import { runtimeEnv } from './runtime-env';

const baseClient = contentful.createClient({
    space: runtimeEnv('CONTENTFUL_SPACE_ID') ?? '',
    accessToken: runtimeEnv('CONTENTFUL_ACCESS_TOKEN') ?? '',
});

export const contentfulClient = new Proxy(baseClient, {
    get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        if (prop !== 'getEntries' && prop !== 'getEntry') return typeof value === 'function' ? value.bind(target) : value;
        return (...args: any[]) => {
            if (getRequestLocale() === 'en') {
                if (prop === 'getEntries') args[0] = { ...(args[0] || {}), locale: 'en-GB' };
                else args[1] = { ...(args[1] || {}), locale: 'en-GB' };
            }
            return value.apply(target, args);
        };
    },
});


