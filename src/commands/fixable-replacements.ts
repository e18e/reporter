import type {Replacement} from '../types.js';
import {codemods} from 'module-replacements-codemods';

export const fixableReplacements: Replacement[] = [
  {
    from: 'array-buffer-byte-length',
    to: 'TODO',
    factory: codemods['array-buffer-byte-length']
  },
  {
    from: 'array-every',
    to: 'TODO',
    factory: codemods['array-every']
  },
  {
    from: 'array-includes',
    to: 'TODO',
    factory: codemods['array-includes']
  },
  {
    from: 'array-map',
    to: 'TODO',
    factory: codemods['array-map']
  },
  {
    from: 'array.from',
    to: 'TODO',
    factory: codemods['array.from']
  },
  {
    from: 'array.of',
    to: 'TODO',
    factory: codemods['array.of']
  },
  {
    from: 'array.prototype.at',
    to: 'TODO',
    factory: codemods['array.prototype.at']
  },
  {
    from: 'array.prototype.concat',
    to: 'TODO',
    factory: codemods['array.prototype.concat']
  },
  {
    from: 'array.prototype.copywithin',
    to: 'TODO',
    factory: codemods['array.prototype.copywithin']
  },
  {
    from: 'array.prototype.entries',
    to: 'TODO',
    factory: codemods['array.prototype.entries']
  },
  {
    from: 'array.prototype.every',
    to: 'TODO',
    factory: codemods['array.prototype.every']
  },
  {
    from: 'array.prototype.filter',
    to: 'TODO',
    factory: codemods['array.prototype.filter']
  },
  {
    from: 'array.prototype.find',
    to: 'TODO',
    factory: codemods['array.prototype.find']
  },
  {
    from: 'array.prototype.findindex',
    to: 'TODO',
    factory: codemods['array.prototype.findindex']
  },
  {
    from: 'array.prototype.flat',
    to: 'TODO',
    factory: codemods['array.prototype.flat']
  },
  {
    from: 'array.prototype.flatmap',
    to: 'TODO',
    factory: codemods['array.prototype.flatmap']
  },
  {
    from: 'array.prototype.foreach',
    to: 'TODO',
    factory: codemods['array.prototype.foreach']
  },
  {
    from: 'array.prototype.indexof',
    to: 'TODO',
    factory: codemods['array.prototype.indexof']
  },
  {
    from: 'array.prototype.join',
    to: 'TODO',
    factory: codemods['array.prototype.join']
  },
  {
    from: 'array.prototype.keys',
    to: 'TODO',
    factory: codemods['array.prototype.keys']
  },
  {
    from: 'array.prototype.lastindexof',
    to: 'TODO',
    factory: codemods['array.prototype.lastindexof']
  },
  {
    from: 'array.prototype.map',
    to: 'TODO',
    factory: codemods['array.prototype.map']
  },
  {
    from: 'array.prototype.push',
    to: 'TODO',
    factory: codemods['array.prototype.push']
  },
  {
    from: 'array.prototype.reduce',
    to: 'TODO',
    factory: codemods['array.prototype.reduce']
  },
  {
    from: 'array.prototype.reduceright',
    to: 'TODO',
    factory: codemods['array.prototype.reduceright']
  },
  {
    from: 'array.prototype.slice',
    to: 'TODO',
    factory: codemods['array.prototype.slice']
  },
  {
    from: 'array.prototype.some',
    to: 'TODO',
    factory: codemods['array.prototype.some']
  },
  {
    from: 'array.prototype.splice',
    to: 'TODO',
    factory: codemods['array.prototype.splice']
  },
  {
    from: 'array.prototype.unshift',
    to: 'TODO',
    factory: codemods['array.prototype.unshift']
  },
  {
    from: 'array.prototype.values',
    to: 'TODO',
    factory: codemods['array.prototype.values']
  },
  {
    from: 'arraybuffer.prototype.slice',
    to: 'TODO',
    factory: codemods['arraybuffer.prototype.slice']
  },
  {
    from: 'concat-map',
    to: 'TODO',
    factory: codemods['concat-map']
  },
  {
    from: 'data-view-buffer',
    to: 'TODO',
    factory: codemods['data-view-buffer']
  },
  {
    from: 'data-view-byte-length',
    to: 'TODO',
    factory: codemods['data-view-byte-length']
  },
  {
    from: 'data-view-byte-offset',
    to: 'TODO',
    factory: codemods['data-view-byte-offset']
  },
  {
    from: 'date',
    to: 'TODO',
    factory: codemods['date']
  },
  {
    from: 'define-properties',
    to: 'TODO',
    factory: codemods['define-properties']
  },
  {
    from: 'error-cause',
    to: 'TODO',
    factory: codemods['error-cause']
  },
  {
    from: 'es-aggregate-error',
    to: 'TODO',
    factory: codemods['es-aggregate-error']
  },
  {
    from: 'es-define-property',
    to: 'TODO',
    factory: codemods['es-define-property']
  },
  {
    from: 'es-errors',
    to: 'TODO',
    factory: codemods['es-errors']
  },
  {
    from: 'es-shim-unscopables',
    to: 'TODO',
    factory: codemods['es-shim-unscopables']
  },
  {
    from: 'es-string-html-methods',
    to: 'TODO',
    factory: codemods['es-string-html-methods']
  },
  {
    from: 'filter-array',
    to: 'TODO',
    factory: codemods['filter-array']
  },
  {
    from: 'for-each',
    to: 'TODO',
    factory: codemods['for-each']
  },
  {
    from: 'function-bind',
    to: 'TODO',
    factory: codemods['function-bind']
  },
  {
    from: 'function.prototype.name',
    to: 'TODO',
    factory: codemods['function.prototype.name']
  },
  {
    from: 'functions-have-names',
    to: 'TODO',
    factory: codemods['functions-have-names']
  },
  {
    from: 'get-symbol-description',
    to: 'TODO',
    factory: codemods['get-symbol-description']
  },
  {
    from: 'global',
    to: 'TODO',
    factory: codemods['global']
  },
  {
    from: 'gopd',
    to: 'TODO',
    factory: codemods['gopd']
  },
  {
    from: 'has',
    to: 'TODO',
    factory: codemods['has']
  },
  {
    from: 'has-own-prop',
    to: 'TODO',
    factory: codemods['has-own-prop']
  },
  {
    from: 'has-proto',
    to: 'TODO',
    factory: codemods['has-proto']
  },
  {
    from: 'has-symbols',
    to: 'TODO',
    factory: codemods['has-symbols']
  },
  {
    from: 'has-tostringtag',
    to: 'TODO',
    factory: codemods['has-tostringtag']
  },
  {
    from: 'hasown',
    to: 'TODO',
    factory: codemods['hasown']
  },
  {
    from: 'index-of',
    to: 'TODO',
    factory: codemods['index-of']
  },
  {
    from: 'is-nan',
    to: 'TODO',
    factory: codemods['is-nan']
  },
  {
    from: 'iterate-value',
    to: 'TODO',
    factory: codemods['iterate-value']
  },
  {
    from: 'last-index-of',
    to: 'TODO',
    factory: codemods['last-index-of']
  },
  {
    from: 'left-pad',
    to: 'TODO',
    factory: codemods['left-pad']
  },
  {
    from: 'math.acosh',
    to: 'TODO',
    factory: codemods['math.acosh']
  },
  {
    from: 'math.atanh',
    to: 'TODO',
    factory: codemods['math.atanh']
  },
  {
    from: 'math.cbrt',
    to: 'TODO',
    factory: codemods['math.cbrt']
  },
  {
    from: 'math.clz32',
    to: 'TODO',
    factory: codemods['math.clz32']
  },
  {
    from: 'math.f16round',
    to: 'TODO',
    factory: codemods['math.f16round']
  },
  {
    from: 'math.fround',
    to: 'TODO',
    factory: codemods['math.fround']
  },
  {
    from: 'math.imul',
    to: 'TODO',
    factory: codemods['math.imul']
  },
  {
    from: 'math.log10',
    to: 'TODO',
    factory: codemods['math.log10']
  },
  {
    from: 'math.log1p',
    to: 'TODO',
    factory: codemods['math.log1p']
  },
  {
    from: 'math.sign',
    to: 'TODO',
    factory: codemods['math.sign']
  },
  {
    from: 'number.isfinite',
    to: 'TODO',
    factory: codemods['number.isfinite']
  },
  {
    from: 'number.isinteger',
    to: 'TODO',
    factory: codemods['number.isinteger']
  },
  {
    from: 'number.isnan',
    to: 'TODO',
    factory: codemods['number.isnan']
  },
  {
    from: 'number.issafeinteger',
    to: 'TODO',
    factory: codemods['number.issafeinteger']
  },
  {
    from: 'number.parsefloat',
    to: 'TODO',
    factory: codemods['number.parsefloat']
  },
  {
    from: 'number.parseint',
    to: 'TODO',
    factory: codemods['number.parseint']
  },
  {
    from: 'number.prototype.toexponential',
    to: 'TODO',
    factory: codemods['number.prototype.toexponential']
  },
  {
    from: 'object-assign',
    to: 'TODO',
    factory: codemods['object-assign']
  },
  {
    from: 'object-is',
    to: 'TODO',
    factory: codemods['object-is']
  },
  {
    from: 'object-keys',
    to: 'TODO',
    factory: codemods['object-keys']
  },
  {
    from: 'object.assign',
    to: 'TODO',
    factory: codemods['object.assign']
  },
  {
    from: 'object.defineproperties',
    to: 'TODO',
    factory: codemods['object.defineproperties']
  },
  {
    from: 'object.entries',
    to: 'TODO',
    factory: codemods['object.entries']
  },
  {
    from: 'object.fromentries',
    to: 'TODO',
    factory: codemods['object.fromentries']
  },
  {
    from: 'object.getprototypeof',
    to: 'TODO',
    factory: codemods['object.getprototypeof']
  },
  {
    from: 'object.hasown',
    to: 'TODO',
    factory: codemods['object.hasown']
  },
  {
    from: 'object.keys',
    to: 'TODO',
    factory: codemods['object.keys']
  },
  {
    from: 'object.values',
    to: 'TODO',
    factory: codemods['object.values']
  },
  {
    from: 'pad-left',
    to: 'TODO',
    factory: codemods['pad-left']
  },
  {
    from: 'parseint',
    to: 'TODO',
    factory: codemods['parseint']
  },
  {
    from: 'promise.allsettled',
    to: 'TODO',
    factory: codemods['promise.allsettled']
  },
  {
    from: 'promise.any',
    to: 'TODO',
    factory: codemods['promise.any']
  },
  {
    from: 'promise.prototype.finally',
    to: 'TODO',
    factory: codemods['promise.prototype.finally']
  },
  {
    from: 'reflect.getprototypeof',
    to: 'TODO',
    factory: codemods['reflect.getprototypeof']
  },
  {
    from: 'reflect.ownkeys',
    to: 'TODO',
    factory: codemods['reflect.ownkeys']
  },
  {
    from: 'regexp.prototype.flags',
    to: 'TODO',
    factory: codemods['regexp.prototype.flags']
  },
  {
    from: 'string.prototype.at',
    to: 'TODO',
    factory: codemods['string.prototype.at']
  },
  {
    from: 'string.prototype.lastindexof',
    to: 'TODO',
    factory: codemods['string.prototype.lastindexof']
  },
  {
    from: 'string.prototype.matchall',
    to: 'TODO',
    factory: codemods['string.prototype.matchall']
  },
  {
    from: 'string.prototype.padend',
    to: 'TODO',
    factory: codemods['string.prototype.padend']
  },
  {
    from: 'string.prototype.padleft',
    to: 'TODO',
    factory: codemods['string.prototype.padleft']
  },
  {
    from: 'string.prototype.padright',
    to: 'TODO',
    factory: codemods['string.prototype.padright']
  },
  {
    from: 'string.prototype.padstart',
    to: 'TODO',
    factory: codemods['string.prototype.padstart']
  },
  {
    from: 'string.prototype.replaceall',
    to: 'TODO',
    factory: codemods['string.prototype.replaceall']
  },
  {
    from: 'string.prototype.split',
    to: 'TODO',
    factory: codemods['string.prototype.split']
  },
  {
    from: 'string.prototype.substr',
    to: 'TODO',
    factory: codemods['string.prototype.substr']
  },
  {
    from: 'string.prototype.trim',
    to: 'TODO',
    factory: codemods['string.prototype.trim']
  },
  {
    from: 'string.prototype.trimend',
    to: 'TODO',
    factory: codemods['string.prototype.trimend']
  },
  {
    from: 'string.prototype.trimleft',
    to: 'TODO',
    factory: codemods['string.prototype.trimleft']
  },
  {
    from: 'string.prototype.trimright',
    to: 'TODO',
    factory: codemods['string.prototype.trimright']
  },
  {
    from: 'string.prototype.trimstart',
    to: 'TODO',
    factory: codemods['string.prototype.trimstart']
  },
  {
    from: 'string.raw',
    to: 'TODO',
    factory: codemods['string.raw']
  },
  {
    from: 'symbol.prototype.description',
    to: 'TODO',
    factory: codemods['symbol.prototype.description']
  },
  {
    from: 'typed-array-buffer',
    to: 'TODO',
    factory: codemods['typed-array-buffer']
  },
  {
    from: 'typed-array-byte-length',
    to: 'TODO',
    factory: codemods['typed-array-byte-length']
  },
  {
    from: 'typed-array-byte-offset',
    to: 'TODO',
    factory: codemods['typed-array-byte-offset']
  },
  {
    from: 'typed-array-length',
    to: 'TODO',
    factory: codemods['typed-array-length']
  },
  {
    from: 'typedarray.prototype.slice',
    to: 'TODO',
    factory: codemods['typedarray.prototype.slice']
  },
  {
    from: 'xtend',
    to: 'TODO',
    factory: codemods['xtend']
  },
  {
    from: 'clone-regexp',
    to: 'TODO',
    factory: codemods['clone-regexp']
  },
  {
    from: 'es-get-iterator',
    to: 'TODO',
    factory: codemods['es-get-iterator']
  },
  {
    from: 'es-set-tostringtag',
    to: 'TODO',
    factory: codemods['es-set-tostringtag']
  },
  {
    from: 'is-array-buffer',
    to: 'TODO',
    factory: codemods['is-array-buffer']
  },
  {
    from: 'is-boolean-object',
    to: 'TODO',
    factory: codemods['is-boolean-object']
  },
  {
    from: 'is-date-object',
    to: 'TODO',
    factory: codemods['is-date-object']
  },
  {
    from: 'is-even',
    to: 'TODO',
    factory: codemods['is-even']
  },
  {
    from: 'is-negative-zero',
    to: 'TODO',
    factory: codemods['is-negative-zero']
  },
  {
    from: 'is-npm',
    to: 'TODO',
    factory: codemods['is-npm']
  },
  {
    from: 'is-number',
    to: 'TODO',
    factory: codemods['is-number']
  },
  {
    from: 'is-number-object',
    to: 'TODO',
    factory: codemods['is-number-object']
  },
  {
    from: 'is-odd',
    to: 'TODO',
    factory: codemods['is-odd']
  },
  {
    from: 'is-plain-object',
    to: 'TODO',
    factory: codemods['is-plain-object']
  },
  {
    from: 'is-primitive',
    to: 'TODO',
    factory: codemods['is-primitive']
  },
  {
    from: 'is-regexp',
    to: 'TODO',
    factory: codemods['is-regexp']
  },
  {
    from: 'is-string',
    to: 'TODO',
    factory: codemods['is-string']
  },
  {
    from: 'is-travis',
    to: 'TODO',
    factory: codemods['is-travis']
  },
  {
    from: 'is-whitespace',
    to: 'TODO',
    factory: codemods['is-whitespace']
  },
  {
    from: 'is-windows',
    to: 'TODO',
    factory: codemods['is-windows']
  },
  {
    from: 'split-lines',
    to: 'TODO',
    factory: codemods['split-lines']
  },
  {
    from: 'chalk',
    to: 'picocolors',
    factory: codemods['chalk']
  },
  {
    from: 'deep-equal',
    to: 'TODO',
    factory: codemods['deep-equal']
  },
  {
    from: 'is-builtin-module',
    to: 'TODO',
    factory: codemods['is-builtin-module']
  },
  {
    from: 'md5',
    to: 'TODO',
    factory: codemods['md5']
  },
  {
    from: 'qs',
    to: 'TODO',
    factory: codemods['qs']
  },
  {
    from: 'traverse',
    to: 'TODO',
    factory: codemods['traverse']
  }
];
