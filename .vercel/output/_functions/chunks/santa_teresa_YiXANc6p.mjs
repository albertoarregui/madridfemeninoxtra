const santa_teresa = new Proxy({"src":"/_astro/santa_teresa.DOQZUy35.png","width":1200,"height":1200,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "C:/Users/PC/madridfemeninoxtra/src/assets/escudos/santa_teresa.png";
							}
							
							return target[name];
						}
					});

const __vite_glob_0_36 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: santa_teresa
}, Symbol.toStringTag, { value: 'Module' }));

export { __vite_glob_0_36 as _ };
