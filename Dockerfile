FROM node:22-alpine AS base
# ENV PNPM_HOME="/pnpm"
# ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable yarn

FROM base AS build
WORKDIR /app
COPY . .
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
ENV NODE_ENV=production
RUN yarn build

FROM base AS dokploy
WORKDIR /app
ENV NODE_ENV=production

# Copy only the necessary files
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000
CMD ["yarn", "start:prod"]