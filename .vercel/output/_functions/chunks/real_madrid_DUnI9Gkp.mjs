const realMadridEscudo = new Proxy({"src":"/_astro/real_madrid.CKBLLj_2.png","width":1200,"height":1200,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "C:/Users/PC/madridfemeninoxtra/src/assets/escudos/real_madrid.png";
							}
							
							return target[name];
						}
					});

const __vite_glob_0_33 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: realMadridEscudo
}, Symbol.toStringTag, { value: 'Module' }));

export { __vite_glob_0_33 as _, realMadridEscudo as r };
