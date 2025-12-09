const arsenal = new Proxy({"src":"/_astro/arsenal.C9ZtRLVv.png","width":1200,"height":1200,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "C:/Users/PC/madridfemeninoxtra/src/assets/escudos/arsenal.png";
							}
							
							return target[name];
						}
					});

const __vite_glob_0_3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: arsenal
}, Symbol.toStringTag, { value: 'Module' }));

export { __vite_glob_0_3 as _ };
