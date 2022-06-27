document.addEventListener('DOMContentLoaded', function () {
    const vue = new Vue({
        data: {
            items: [],
            refreshItems: false,
            currentNav: 'mine',
            page: {
                list: [],
                title: ''
            },
        },
        computed: {},
        render: function (h) {
            const _this = this;
            const contentMine = h('div', {
                class: 'content-mine h-full'
            }, [
                h('div', {
                    attrs: {
                        class: 'flex items-center justify-between p-2 overflow-hidden'
                    }
                }, [
                    h('div', {
                        attrs: {
                            class: 'bg-green-50'
                        }
                    }, ['chameleon']),
                    h('button', {
                        attrs: {
                            class: 'bg-gray-200 px-2 py-1'
                        },
                        on: {
                            click: () => {
                                _this.refreshItems = true
                                _this.items = []
                                chrome.runtime.sendMessage({
                                    action: 'loadItemsFromDb',
                                }, function (response) {
                                    console.log(response, chrome.runtime.lastError);
                                    _this.items = JSON.parse(response)
                                    _this.refreshItems = false
                                });
                            }
                        }
                    }, ['刷新' + (_this.refreshItems ? '...' : '')])
                ]),
                h('div', {
                    attrs: {
                        class: 'items overflow-auto',
                        style: 'height: calc(100% - 42px);'
                    }
                }, _this.items.map(item => {
                    return h('div', {
                        attrs: {
                            class: 'item p-2 border-t'
                        }
                    }, [
                        h('div', {
                                attrs: {
                                    class: 'item text-base mb-1'
                                }
                            },
                            [
                                item.name,
                                h('div', {
                                    attrs: {
                                        class: 'text-gray-500 text-sm'
                                    }
                                }, [item.host])
                            ]
                        ),
                        h('div', {
                            attrs: {
                                class: 'hidden-doms'
                            }
                        }, item.hiddenDoms.map(hiddenDom => {
                            return h('div', {
                                attrs: {
                                    class: 'hidden-dom flex items-center'
                                }
                            }, [h('input', {
                                attrs: {
                                    class: 'hidden-dom-checkbox mr-1',
                                    type: 'checkbox',
                                    checked: hiddenDom.checked,
                                    id: item._id + hiddenDom.name
                                },
                                on: {
                                    change(event) {
                                        hiddenDom.checked = !!event.target.checked
                                        _this.switchHiddenDom(event, hiddenDom, item)
                                    }
                                }
                            }, []), h('label', {
                                attrs: {
                                    for: item._id + hiddenDom.name
                                }
                            }, [hiddenDom.name])])
                        })),
                        h('div', {
                            attrs: {
                                class: 'styles'
                            }
                        }, (item.styles || []).map(style => {
                            return h('div', {
                                attrs: {
                                    class: 'style flex items-center bg-green-50'
                                }
                            }, [h('input', {
                                attrs: {
                                    class: 'style-checkbox mr-1',
                                    type: 'checkbox',
                                    checked: style.checked,
                                    id: item._id + style.name
                                },
                                on: {
                                    change(event) {
                                        style.checked = !!event.target.checked
                                        _this.switchStyle(event, style, item)
                                    }
                                }
                            }, []), h('label', {
                                attrs: {
                                    for: item._id + style.name
                                }
                            }, [style.name])])
                        }))
                    ])
                }))
            ])
            const contentCreate = h('div', {
                class: 'content-create h-full overflow-auto p-2'
            }, [
                h('div', {
                    class: 'page'
                }, [
                    _this.page.title,
                    h('div', {
                        class: 'page-items'
                    }, _this.page.list.map(item => {
                        return h('div', {
                            class: 'page-item',
                        }, [h('input', {
                            attrs: {
                                class: 'hidden-dom-checkbox mr-1',
                                type: 'checkbox',
                                checked: false,
                                id: item.insideId
                            },
                            on: {
                                change(event) {
                                    _this.switchHiddenDom(event, {
                                        checked: !!event.target.checked,
                                        selector: item.selector,
                                        name: item.insideId
                                    }, {
                                        host: '',
                                        name: '当前页面'
                                    })
                                }
                            }
                        }, []), h('label', {
                            attrs: {
                                for: item.insideId
                            }
                        }, [item.content])])
                    }))
                ])
            ]);

            return h(
                'div', {
                    class: 'w-80 h-96 pb-1 body flex items-stretch overflow-hidden'
                },
                [
                    h('div', {
                        class: "navs bg-gray-50 p-2 flex-none"
                    }, [
                        h('div', {
                            class: "nav nav-mine cursor-pointer",
                            on: {
                                click() {
                                    _this.currentNav = 'mine'
                                }
                            }
                        }, ['我的']),
                        h('div', {
                            class: "nav nav-create cursor-pointer",
                            on: {
                                click() {
                                    _this.currentNav = 'create'
                                    chrome.tabs.query({
                                        active: true,
                                        currentWindow: true
                                    }, function (tabs) {
                                        chrome.tabs.sendMessage(
                                            tabs[0].id, {
                                                action: 'loadDocument'
                                            },
                                            function (response) {
                                                // window.close();
                                                _this.page = response;
                                            }
                                        );
                                    });
                                }
                            }
                        }, ['创建'])
                    ]),
                    h('div', {
                        class: 'flex-auto h-full'
                    }, [_this.currentNav == 'mine' ? contentMine : contentCreate])
                ]
            )
        },
        watch: {},
        created() {
            // 加载用户设置
            const _this = this;
            chrome.runtime.sendMessage({
                action: 'loadItems',
            }, function (response) {
                console.log(response, chrome.runtime.lastError);
                _this.items = JSON.parse(response)
            });
        },
        methods: {
            switchHiddenDom(event, hiddenDom, item) {
                console.log(event, hiddenDom, item);
                // 交给background处理
                chrome.runtime.sendMessage({
                    action: 'switchHiddenDom',
                    data: {
                        hiddenDom,
                        item
                    }
                }, function (response) {
                    console.log(response);
                });
            },
            switchStyle(event, style, item) {
                console.log(event, style, item);
                // 交给background处理
                chrome.runtime.sendMessage({
                    action: 'switchStyle',
                    data: {
                        style,
                        item
                    }
                }, function (response) {
                    console.log(response);
                });
            }
        }
    });

    vue.$mount('#app')

});