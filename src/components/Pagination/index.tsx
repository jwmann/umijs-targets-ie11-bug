import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import classNames from "classnames";
import { FormattedMessage } from 'umi-plugin-react/locale';
import styles from './index.less';

export type Props = {
  onClick?: ( event: React.MouseEvent<HTMLLIElement>, pageIndex: number ) => void;
  pages?: number;
  active?: number;
}

const Pagination: React.FC<Props> = ( props: Props ) => {
  const { pages, active, onClick = () => { } } = props;

  const renderPages = () => {
    if ( !pages ) return null;

    const pageList = [];
    const renderPageNumberClass = ( index: number ) => classNames( styles.pageNumber, `page-${ index }`, { active: index === active } );

    for ( let index = 0; index < pages; index++ ) {
      pageList.push(
        <>
          <li className={renderPageNumberClass( index )} onClick={( event: React.MouseEvent<HTMLLIElement> ) => onClick( event, index )}>
            <span className={styles.number}>{index + 1}</span>
          </li>
          {index !== pages - 1 ? <li className={styles.divider}></li> : null}
        </>
      );
    }

    return pageList;
  }

  return (
    <aside className={styles.pagination}>
      <div className={classNames( styles.label, 'left' )}>
        <FormattedMessage
          id="pagination.left.label"
          defaultMessage="Light"
        />
      </div>
      <ol className={styles.pageNumbers}>
        {renderPages()}
      </ol>
      <div className={classNames( styles.label, 'right' )}>
        <FormattedMessage id="pagination.right.label" defaultMessage="Strong" />
      </div>
    </aside>
  );
};

Pagination.defaultProps = {
  onClick: () => { },
  pages: 0,
  active: 0
}

export default Pagination;
