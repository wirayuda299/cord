import * as React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "phantom-ui": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { loading?: boolean | string },
        HTMLElement
      >;
    }
  }
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "phantom-ui": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { loading?: boolean | string },
        HTMLElement
      >;
    }
  }
}
