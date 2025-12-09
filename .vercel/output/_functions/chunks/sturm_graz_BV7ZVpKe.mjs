const sturm_graz = new Proxy({"src":"/_astro/sturm_graz.BAzlW7u5.png","width":1200,"height":1200,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "C:/Users/PC/madridfemeninoxtra/src/assets/escudos/sturm_graz.png";
							}
							
							return target[name];
						}
					});

const __vite_glob_0_43 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: sturm_graz
}, Symbol.toStringTag, { value: 'Module' }));

export { __vite_glob_0_43 as _ };
