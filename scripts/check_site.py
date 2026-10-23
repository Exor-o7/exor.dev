"""Check the buildless site's local navigation, assets, and project directories."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re

ROOT = Path(__file__).resolve().parents[1]
FILES = sorted(ROOT.glob('*.html')) + sorted((ROOT / 'blog').glob('*.html')) + sorted((ROOT / 'projects').glob('*.html'))


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.ids, self.links, self.images, self.projects, self.headings, self.details = [], [], [], [], [], []
        self.feed(source)

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag in ('a', 'link') and attrs.get('href'):
            self.links.append(attrs['href'])
        if attrs.get('src'):
            self.links.append(attrs['src'])
        if tag == 'img':
            self.images.append(attrs)
        if 'data-project' in attrs:
            self.projects.append(attrs)
        if tag == 'article' and attrs.get('data-status'):
            self.details.append(attrs)
        if re.fullmatch(r'h[1-6]', tag):
            self.headings.append(int(tag[1]))


def main():
    pages = {path: Page(path.read_text(encoding='utf-8')) for path in FILES}
    errors = []
    for path, page in pages.items():
        name = str(path.relative_to(ROOT))
        duplicates = [key for key, count in Counter(page.ids).items() if count > 1]
        if duplicates:
            errors.append(f'{name}: duplicate IDs {duplicates}')
        if page.headings.count(1) != 1 or 'main-content' not in page.ids:
            errors.append(f'{name}: expected one h1 and a main-content target')
        for url in page.links:
            parsed = urlsplit(url)
            if parsed.scheme or parsed.netloc:
                continue
            target = (ROOT / unquote(parsed.path.lstrip('/')) if parsed.path.startswith('/')
                      else path.parent / unquote(parsed.path)) if parsed.path else path
            if target.is_dir():
                target /= 'index.html'
            target = target.resolve()
            if not target.is_file():
                errors.append(f'{name}: missing local target {url}')
            elif parsed.fragment and target in pages and unquote(parsed.fragment) not in pages[target].ids:
                errors.append(f'{name}: missing anchor {url}')
        for image in page.images:
            if not all(key in image for key in ('alt', 'width', 'height')):
                errors.append(f'{name}: image needs alt text and intrinsic dimensions')
        if page.projects:
            source = path.read_text(encoding='utf-8')
            if f'>{len(page.projects)} projects</span>' not in source:
                errors.append(f'{name}: initial project count differs from directory')
            order = {'active': 0, 'wip': 1, 'released': 2}
            statuses = [order.get(card.get('data-status'), -1) for card in page.projects]
            if -1 in statuses or statuses != sorted(statuses):
                errors.append(f'{name}: project lifecycle order is invalid')
            if any(not card.get('data-categories') for card in page.projects):
                errors.append(f'{name}: project filter metadata missing')
            for control in ('project-search', 'project-count', 'empty-state', 'reset-projects'):
                if control not in page.ids:
                    errors.append(f'{name}: directory control missing: {control}')
    home = pages[ROOT / 'index.html']
    detail = pages[ROOT / 'projects.html']
    if home.projects or 'projects-heading' in home.ids:
        errors.append('The full project directory belongs on the Projects page')
    home_source = (ROOT / 'index.html').read_text(encoding='utf-8')
    if f'data-project-total>{len(detail.projects)}</strong>' not in home_source:
        errors.append('Homepage project highlight differs from the Projects directory')
    if 'id="about"' in home_source:
        errors.append('The removed About & current focus section remains on the homepage')
    if len(detail.details) != len(detail.projects):
        errors.append('Every project detail article must be searchable')
    detail_statuses = [{'active': 0, 'wip': 1, 'released': 2}.get(card.get('data-status'), -1) for card in detail.details]
    if -1 in detail_statuses or detail_statuses != sorted(detail_statuses):
        errors.append('Project detail lifecycle order is invalid')
    for path in (ROOT / 'css').glob('*.css'):
        source = path.read_text(encoding='utf-8')
        for url in re.findall(r'url\(["\']?([^"\')]+)', source):
            if not urlsplit(url).scheme and not (path.parent / url).resolve().is_file():
                errors.append(f'{path.name}: missing CSS asset {url}')
    assert not errors, '\n'.join(errors)
    print(f'PASS: {len(pages)} pages; local links and anchors; assets; one h1 per page; '
          f'{len(detail.projects)} projects; homepage structure; status order and controls.')


if __name__ == '__main__':
    main()
