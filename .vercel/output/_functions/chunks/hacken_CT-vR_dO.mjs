const hacken = new Proxy({"src":"/_astro/hacken.CePtrpYl.png","width":1200,"height":1200,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "C:/Users/PC/madridfemeninoxtra/src/assets/escudos/hacken.png";
							}
							
							return target[name];
						}
					});

const __vite_glob_0_23 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: hacken
}, Symbol.toStringTag, { value: 'Module' }));

export { __vite_glob_0_23 as _ };
