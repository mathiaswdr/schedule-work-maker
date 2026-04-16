type IntlMessages = Record<string, unknown>;

export function pickMessages<TMessages extends IntlMessages>(
  messages: TMessages,
  namespaces: readonly string[],
) {
  return namespaces.reduce<IntlMessages>((scoped, namespace) => {
    const value = messages[namespace];

    if (value !== undefined) {
      scoped[namespace] = value;
    }

    return scoped;
  }, {});
}
