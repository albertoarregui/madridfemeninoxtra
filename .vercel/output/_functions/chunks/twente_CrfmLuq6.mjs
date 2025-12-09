const twente = new Proxy({"src":"/_astro/twente.CJEzifa3.png","width":1200,"height":1200,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "C:/Users/PC/madridfemeninoxtra/src/assets/escudos/twente.png";
							}
							
							return target[name];
						}
					});

const __vite_glob_0_45 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: twente
}, Symbol.toStringTag, { value: 'Module' }));

export { __vite_glob_0_45 as _ };
