const bayern_munich = new Proxy({"src":"/_astro/bayern_munich.hBpay9tq.png","width":1200,"height":1200,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "C:/Users/PC/madridfemeninoxtra/src/assets/escudos/bayern_munich.png";
							}
							
							return target[name];
						}
					});

const __vite_glob_0_7 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: bayern_munich
}, Symbol.toStringTag, { value: 'Module' }));

export { __vite_glob_0_7 as _ };
