const alaves = new Proxy({"src":"/_astro/alaves.5leqBmZf.png","width":1200,"height":1200,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "C:/Users/PC/madridfemeninoxtra/src/assets/escudos/alaves.png";
							}
							
							return target[name];
						}
					});

const __vite_glob_0_0 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: alaves
}, Symbol.toStringTag, { value: 'Module' }));

export { __vite_glob_0_0 as _ };
