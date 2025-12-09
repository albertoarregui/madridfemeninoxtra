const alhama = new Proxy({"src":"/_astro/alhama.NmDM0xvU.png","width":1200,"height":1200,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "C:/Users/PC/madridfemeninoxtra/src/assets/escudos/alhama.png";
							}
							
							return target[name];
						}
					});

const __vite_glob_0_1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: alhama
}, Symbol.toStringTag, { value: 'Module' }));

export { __vite_glob_0_1 as _ };
