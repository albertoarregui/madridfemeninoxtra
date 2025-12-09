const psg = new Proxy({"src":"/_astro/psg.FYf81eat.png","width":1200,"height":1200,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "C:/Users/PC/madridfemeninoxtra/src/assets/escudos/psg.png";
							}
							
							return target[name];
						}
					});

const __vite_glob_0_30 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: psg
}, Symbol.toStringTag, { value: 'Module' }));

export { __vite_glob_0_30 as _ };
